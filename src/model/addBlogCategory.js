const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://TechBlog:akjs1234@techblogcluster.iqvwdiy.mongodb.net/techBlog");
const schema =mongoose.Schema;
const blogCategorySchema = new schema({
    blogCategory:String
});
var blogCategoryMongo =mongoose.model("blogCategories",blogCategorySchema);
module.exports=blogCategoryMongo;



