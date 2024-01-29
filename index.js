const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const FormDataModel = require('./models/FormData');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect('mongodb+srv://sri:sri@hhdev.amtukyd.mongodb.net/?retryWrites=true&w=majority');

// Secret key for JWT
const secretKey = 'sritest';

app.post('/register', (req, res) => {
    const { email, password } = req.body;

    FormDataModel.findOne({ email: email })
        .then(user => {
            if (user) {
                res.json("Already registered");
            } else {
                FormDataModel.create(req.body)
                    .then((userobj) => {
                        FormDataModel.updateOne({ _id: userobj.parentId }, { $push: { child: userobj._id+'' } })
                            .then(result => {
                                console.log('-----',result);
                                if (result.modifiedCount > 0) {
                                    // If at least one document is modified, consider it a success
                                    console.log(`User with email ${email} has been updated.`);
                                    res.json({ message: 'User updated successfully' });
                                } else {
                                    // If no document is modified, the user might not exist
                                    res.status(404).json({ error: 'User not found or no changes applied' });
                                }
                            })
                            .catch(err => res.status(500).json({ error: 'Internal Server Error' }));
                        
                    })
                    .catch(err => res.json(err));
            }
        });
});


app.post('/login', (req, res) => {
    const { email, password } = req.body;

    FormDataModel.findOne({ email: email })
        .then(user => {
            if (user) {
                if (user.password === password) {
                    // Generate a JWT token upon successful authentication
                    const token = jwt.sign({ name:user.name, email: user.email, _id:user._id }, secretKey, { expiresIn: '30m' });
                    res.json({ token });
                } else {
                    res.json("Wrong password");
                }
            } else {
                res.json("No records found!");
            }
        })
        .catch(err => res.json(err));
});

// Protected route example
app.get('/authonticate', (req, res) => {
    const token = req.headers.authorization;
    
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, secretKey);
        // You can now access the user information from decoded.userId and decoded.email
        // For example, you can find the user in the database and send relevant information back
        FormDataModel.findOne({ email: decoded.email})
            .then(user => {
                if (user) {
                    res.json({ message: 'Welcome to the protected route!', user: user });
                } else {
                    res.status(401).json({ error: 'User not found' });
                }
            })
            .catch(err => res.status(500).json({ error: 'Internal Server Error' }));
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

app.get('/users', (req, res) => {
    FormDataModel.find({}, 'name email')
        .then(users => {
            res.json(users);
        })
        .catch(err => res.status(500).json({ error: 'Internal Server Error' }));
});

app.get('/getTreeUsers', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        if(decoded.email){
            FormDataModel.find({})
            .then(users => {
                
                var ur = users.find(u => u._id+'' == decoded._id);
                let userlistobj = {name:ur.name,children:[]};
                if(ur.parentId && ur.parentId!='root'){
                    rec([ur.parentId], userlistobj, users, ur._id+'')
                }
                if(ur.child){
                    rec(ur.child, userlistobj, users);
                }
                res.json(userlistobj);
            })
            .catch(err => res.status(500).json({ error: 'Internal Server Error' }));
    
        }
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});


function rec(childrens, userRecObj, users, skipuser){
    if(childrens){
        for(let child in childrens){
            if(childrens[child] != skipuser){
                var ur = users.find(u => (u._id+'' == childrens[child]));
                let tempOjb = {name:'srinivas',children:[]};
                tempOjb.name = ur.name;
                userRecObj.children.push(tempOjb)
                if(ur.child ){
                    rec(ur.child,tempOjb, users, skipuser);
                }else{
                    return;
                }
            }
        }   
    }
   
}


// Add this route to your existing code with a different name

// Modify the existing delete endpoint to accept an array of user IDs
app.delete('/deleteUsers', (req, res) => {
    const userIds = req.body.userIds;

    // Validate if userIds is an array of valid ObjectIds
    if (!userIds || !Array.isArray(userIds) || userIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({ error: 'Invalid user IDs' });
    }

    // Find and remove the users by IDs
    FormDataModel.deleteMany({ _id: { $in: userIds } })
        .then(result => {
            // Check if at least one document is deleted
            if (result.deletedCount > 0) {
                // Update the parent's child array if necessary
                FormDataModel.updateMany({ _id: { $in: userIds } }, { $pull: { child: { $in: userIds } } })
                    .then(() => {
                        console.log(`Users with IDs ${userIds.join(', ')} have been deleted.`);
                        res.json({ message: 'Users deleted successfully' });
                    })
                    .catch(err => res.status(500).json({ error: 'Internal Server Error' }));
            } else {
                res.status(404).json({ error: 'Users not found' });
            }
        })
        .catch(err => res.status(500).json({ error: 'Internal Server Error' }));
});

// Update user route
app.put('/updateUser/:userId', (req, res) => {
    console.log('ram');
    const userId = req.params.userId;
    console.log("Userid"+userId);
    const { name, email, password, parentId, job, companyname, about, skill } = req.body;
    let users = FormDataModel.findOne({ _id: userId })
    // Find the user by ID
    
  
    // If the user is not found, return an error
    if (users.name) {
      return res.status(404).json({ error: 'User not found' });
    }
  
    FormDataModel.updateOne({ _id: userId }, { name:name, email:email, password:password, parentId:parentId, job:job, about:about, skill:skill})
                            .then(result => {
                                console.log('-----',result);
                                if (result.modifiedCount > 0) {
                                    console.log(`User with email ${email} has been updated.`);
                                    res.json({ message: 'User updated successfully' });
                                } else {
                                    // If no document is modified, the user might not exist
                                    res.status(404).json({ error: 'User not found or no changes applied' });
                                }
                            })
                            .catch(err => res.status(500).json({ error: 'Internal Server Error' }));
   
  });



// Logout endpoint
app.post('/logout', (req, res) => {
    // You can perform any necessary cleanup or additional actions on logout
    res.json({ message: 'Logout successful' });
});

app.listen(3001, () => {
    console.log("Server listening on http://127.0.0.1:3001");
});