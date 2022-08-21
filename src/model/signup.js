const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://TechBlog:akjs1234@techblogcluster.iqvwdiy.mongodb.net/techBlog");
const schema =mongoose.Schema;
const blogschema = new schema({
    name:String,
    user:String,
    email:String,
    password:String,
});
var signupmongo =mongoose.model("signup",blogschema);
module.exports=signupmongo;



