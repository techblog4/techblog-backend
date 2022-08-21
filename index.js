const express=require("express");
const cors = require("cors");
const jwt =require("jsonwebtoken");
const multer = require("multer");
const signupmongo=require("./src/model/signup");
const adminmongo =require("./src/model/admin");
const blogcategorymongo = require("./src/model/addBlogCategory");
const homemongo =require("./src/model/home");
const usermongo=require("./src/model/usermongo");
const { exists } = require("./src/model/signup");
const app = new express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
const PORT = process.env.PORT || 4001;


//middleware function..static
app.use(express.static('./public'));


// multer setup

// setting up storage folder destination and filename
const storage = multer.diskStorage({
    destination: function(req, file, callback) {
      callback(null, './public/images');
    },
    filename: function (req, file, callback) {
      callback(null, file.originalname);
    }
  });
  
 // specifying file type
  const fileFilter = (req,file,callback)=>{
   if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
   callback(null,true);
   }
   else{
       callback(null,false);
   }
  }
  
  
  const upload = multer({
      storage: storage,
      fileFilter:fileFilter
    });
  

// multer ends

// Middleware Fuction to verify Token send from FrontEnd
function verifyToken(req,res,next){

  if(!req.headers.authorization){
     return res.status(401).send("Unauthorized Access")
  }
  let token = req.headers.authorization.split(' ')[1];
 
 if(token == "null"){
     return res.status(401).send("Unauthorized Access")
 }

 let payload= jwt.verify(token , "secretkey")
 if(!payload){
     return res.status(401).send("Unauthorized Access")
 }
 req.userId = payload.subject
      next()
 };

//all approved blogs 

app.get("/home",(req,res)=>{
  res.header("Access-Control-Allow-Origin","*"); 
  res.header("Access-Control-Allow-Methods:GET,POST,PUT,DELETE");
  usermongo.find({"isVerified":"1"}).then((data)=>{
     res.send(data)
    });
  });


//carosel

app.get("/homecarosel",(req,res)=>{
    res.header("Access-Control-Allow-Origin","*"); 
    res.header("Access-Control-Allow-Methods:GET,POST,PUT,DELETE");
      
    homemongo.find()
    .then((data)=>{
       res.send(data)
      });
      
    });

// signup

app.post("/signup",(req,res)=>{
  res.header("Access-Control-Allow-Origin","*");
  res.header("Access-Control-Allow-Headers: Content-Type, application/json");
  res.header("Access-Control-Allow-Methods:GET,POST,PATCH,PUT,DELETE,OPTIONS");

    var signups = {
        name:req.body.item.name,
        user:req.body.item.user,
        email:req.body.item.email,
        password:req.body.item.password,
      
    }
    signupmongo.findOne({
      "email":signups.email
      },
    function(err,user){  
      if(!user){
          var post = new signupmongo(signups)
          post.save(function (err) {
            if (!err) {
              res.json({status:true}).status(200);
                
              }
            else
              {
                  console.log("error");
              }
             }); 
            }
            else
            {
              res.json({userexist:true}).status(406);
            }
   
 });
});

// login

app.post("/login",(req,res)=>{
      
  res.header("Access-Control-Allow-Origin","*");
  res.header("Access-Control-Allow-Headers: Content-Type, application/json");
  res.header("Access-Control-Allow-Headers: Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods:GET,POST,PUT,DELETE");
    
   let logindata= {
              email:req.body.data.email,
              password:req.body.data.password
          }       
   signupmongo.findOne({
        "email":logindata.email
        },
        
   function(err,user){
  if(user) {
  if(logindata.password==user.password){
  if(user.user=="student"){
   let payload = {subject:logindata.email+logindata.password}
   let token =jwt.sign(payload,'secretkey')
   let studentEmail = {subject:logindata.email};
   let studentToken = jwt.sign(studentEmail.subject,'secretkey');
   const decoded1 = jwt.verify(studentToken, "secretkey");
     res.status(200).send({student:true,token,decoded1});
  
}
  else if(user.user=="trainer"){
   let payload = {subject:logindata.email+logindata.password}
   let token =jwt.sign(payload,'secretkey')
   let payloadEmail = {subject:logindata.email};
   let emailToken = jwt.sign(payloadEmail.subject,'secretkey');
   const decoded = jwt.verify(emailToken, "secretkey");
   res.status(200).send({trainer:true,token,decoded});
  
}
  else if(user.user=="admin")
  {
    let payload = {subject:logindata.email+logindata.password}
    let token = jwt.sign(payload,'secretkey');
    let adminEmail = {subject:logindata.email};
    let adminEmailToken = jwt.sign(adminEmail.subject,'secretkey');
    const decodedAdminEmail = jwt.verify(adminEmailToken, "secretkey");
    res.status(200).send({admin:true,token,decodedAdminEmail});    
}
}
else
 {
  res.json({unathorised:true}).status(401);
 }
}
else
  {
    res.json({unathorised:true}).status(401);
  }
});
});

  // Counts of all blog statuses
  
  app.get("/getBlogCounts",(req,res)=>{
    res.header("Access-Control-Allow-Origin","*"); 
    res.header("Access-Control-Allow-Methods:GET,POST,PUT,DELETE");
    usermongo.count().then((count1) => {
      totalBlogs = count1;
      usermongo.find({$and:[{isVerified:"1"}]}).count().then((count2) => {
        approvedBlogs = count2;
        usermongo.find({$and:[{isVerified:"0"}]}).count().then((count3) => {
          pendingBlogs = count3;
          usermongo.find({$and:[{isVerified:"2"}]}).count().then((count4) => {
            rejectedBlogs = count4;
            res.status(200).send({totalBlogs,pendingBlogs,rejectedBlogs,approvedBlogs});
          });
        });
      });
    });
      
  });
  
//create a post

app.post("/addpost",upload.single('image'), verifyToken,(req,res)=>{

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
  
    const file = req.file;
    const d = new Date();
    var date=d.toDateString();
    var posts ={
        
        title:req.body.title,
        description:req.body.description,
        isVerified:'0',
        date1:date,
        email:req.body.currentEmail,
        userType:req.body.userType,
        authorname:req.body.currentUser,
        image: 'https://techblogict.herokuapp.com/images/'+ req.file.filename
       
    }
  
    var posters = new usermongo(posts);
    posters.save();

});


//add blogcategory

app.post("/addblogcategory",verifyToken,(req,res)=>{
  res.header("Access-Control-Allow-Origin","*");
  res.header("Access-Control-Allow-Headers: Content-Type, application/json");
  res.header("Access-Control-Allow-Methods:GET,POST,PATCH,PUT,DELETE,OPTIONS");
  var blogCategory = {
     blogCategory:req.body.item.blogCategory
  }
  var blogCategoryDB = new blogcategorymongo(blogCategory)
  blogCategoryDB.save(function (err) {
 if (!err) {
   res.json({status:true}).status(200);
   
 }
 else
 {
     console.log("error");
 }
});
});

// all blogs in admin

app.get("/getAllBlogs",(req,res)=>{
  res.header("Access-Control-Allow-Origin","*"); 
  res.header("Access-Control-Allow-Methods:GET,POST,PUT,DELETE");
   usermongo.find().then((data)=>{
     res.send(data);
    });
    
});

// active blogs in admin

app.get("/activeBlogs",(req,res)=>{
  res.header("Access-Control-Allow-Origin","*"); 
  res.header("Access-Control-Allow-Methods:GET,POST,PUT,DELETE");
   usermongo.find({$and:[{isVerified:"1"}]}).then((data)=>{
     res.send(data);
    });
    
});

//rejected blogs in admin

app.get("/rejectedBlogs",(req,res)=>{
  res.header("Access-Control-Allow-Origin","*"); 
  res.header("Access-Control-Allow-Methods:GET,POST,PUT,DELETE");
  usermongo.find({$and:[{isVerified:"2"}]}).then((data)=>{
     res.send(data);
    });
    
});

//approve pending blogs in admin

app.get("/getNotApprovedBlogs",(req,res)=>{
  res.header("Access-Control-Allow-Origin","*"); 
  res.header("Access-Control-Allow-Methods:GET,POST,PUT,DELETE");
   usermongo.find({$and:[{isVerified:"0"}]}).then((data)=>{
     res.send(data);
    });
    
});

//blog categgories

app.get("/getBlogCategory",(req,res)=>{
  res.header("Access-Control-Allow-Origin","*"); 
  res.header("Access-Control-Allow-Methods:GET,POST,PUT,DELETE");
  blogcategorymongo.find().then((data)=>{
     res.send(data);
    });
    
});


app.post("/getBlogById",verifyToken,(req,res)=>{
  res.header("Access-Control-Allow-Origin","*"); 
  res.header("Access-Control-Allow-Methods:GET,POST,PUT,DELETE");
   usermongo.findById(req.body.data).then((data)=>{
     res.send(data);
    });
});

//approve blogs

app.post("/approveBlog/:category",verifyToken,(req,res)=>{
  res.header("Access-Control-Allow-Origin","*"); 
  res.header("Access-Control-Allow-Methods:GET,POST,PUT,DELETE");
  const cate = req.params.category;
   usermongo.findByIdAndUpdate({"_id":req.body.data},
    {$set:{"isVerified":"1"},"category":cate}).then((data)=>{
     res.send(data);
    });
});


app.post("/rejectBlog",verifyToken,(req,res)=>{
  res.header("Access-Control-Allow-Origin","*"); 
  res.header("Access-Control-Allow-Methods:GET,POST,PUT,DELETE");
  usermongo.findByIdAndUpdate({"_id":req.body.data},
  {$set:{"isVerified":"2"}}).then((data)=>{
     res.send(data);
    });
  });

    
app.post("/getUserName",verifyToken,(req,res)=>{
  res.header("Access-Control-Allow-Origin","*"); 
  res.header("Access-Control-Allow-Methods:GET,POST,PUT,DELETE");
  email1=req.body.data.currentEmail;
    signupmongo.find({$and:[{email:email1}]}).then((data)=>{
       res.send(data);
      });
});
app.post("/getCurrentUser",verifyToken,(req,res)=>{
  res.header("Access-Control-Allow-Origin","*"); 
  res.header("Access-Control-Allow-Methods:GET,POST,PUT,DELETE");
  currentUserEmail=req.body.data;
  console.log(currentUserEmail);
    signupmongo.findOne({$and:[{email:currentUserEmail}]}).then((data)=>{
       res.send(data);
      });
});


app.post("/currentUserBlogs",verifyToken,(req,res)=>{
  res.header("Access-Control-Allow-Origin","*"); 
  res.header("Access-Control-Allow-Methods:GET,POST,PUT,DELETE");
  email1=req.body.data.currentEmail;
  
    usermongo.find({$and:[{email:email1}]}).then((data)=>{
       res.send(data); 
      });
});


app.get('/:id',  (req, res) => {
  const id = req.params.id;
    usermongo.findOne({"_id":id})
      .then((posts)=>{
          res.send(posts);
        });
});


app.get('/getCategoryById/:id',(req, res) => {
  const id = req.params.id;
    blogcategorymongo.findOne({"_id":id})
      .then((posts)=>{
        res.send(posts);
        });
});


    
app.get('/getBlogByCategory/:id',(req, res) => {
  const catId = req.params.id;
    usermongo.find({"category":catId})
     .then((posts)=>{
        res.send(posts);
        });
});

    
app.put('/update',upload.single("image"),verifyToken,(req,res)=>{
    if(req.file != undefined)
    {
    const file = req.file;
    img = 'https://techblogict.herokuapp.com/images/'+ req.file.filename;
    }
    else
    {
      img = req.body.image;
    }
    id=req.body._id,
    title = req.body.title,
    description = req.body.description
    usermongo.findByIdAndUpdate({"_id":id},
                                {$set:{
                                "title":title,
                                "image": img,
                                "description":description,
                                "isVerified":"0"
                                }})
   .then(function(){
       res.send();
   })
});


app.delete('/remove/:id',verifyToken,(req,res)=>{
   id = req.params.id;
  usermongo.findByIdAndDelete({"_id":id})
  .then(()=>{
      res.send();
  })
});



app.delete('/deleteCategory/:id',verifyToken,(req,res)=>{
  id = req.params.id;
  blogcategorymongo.findByIdAndDelete({"_id":id})
   .then(()=>{
    res.send();
  })
});


app.get('/:_id',(req,res)=>
 {
  const id = req.params.id;
    usermongo.findOne({"_id":_id},
                    {$set:{
                   "title":title,
                   "file":file,
                   "description":description,
                   
    }})
    .then((posts)=>{
      res.send(posts);
  });
});



app.post("/changePwd/:userEmail",verifyToken,(req,res)=>{
  res.header("Access-Control-Allow-Origin","*"); 
  res.header("Access-Control-Allow-Methods:GET,POST,PUT,DELETE");
  email = req.params.userEmail;
   signupmongo.updateOne({"email":email},
      {$set:{"password":req.body.password}}).then((data)=>{
        res.send(data);
      });
});


app.listen(PORT,()=>{
    console.log("server is running");
});