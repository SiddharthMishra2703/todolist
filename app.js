require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://Siddharth-Mishra:" + process.env.ATLAS_PASS + "@cluster0.d8bxs5u.mongodb.net/todolistDB");

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

const item1 = new Item({
    name: 'Welcome to your todolist!'
});

const item2 = new Item({
    name: 'Hit the + button to add a new item.'
});

const item3 = new Item({
    name: '<-- Hit this to delete an item.'
});

const defaultItems = [item1, item2, item3];


app.get("/", function (req, res) {

    Item.find({}, function (err, foundItems) {
        if(foundItems.length === 0){
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Succesfully saved default items to DB.");
                }
            });
            res.redirect("/");
        }else{
            res.render("list", { listTitle: 'Today', newListItems: foundItems });
        }
    });
});

app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;
    // res.send(listName);
    const item = new Item({
        name: itemName
    });

    if(listName === 'Today'){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect('/' + listName);
        });
    }

});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === 'Today'){
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(err){
                console.log(err);
            }else{
                console.log("Item deleted");
            }
            res.redirect("/");
        });
    }else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
            if(!err){
                res.redirect("/" + listName);
            }
        });
    }
    
});


app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
        if(!err){
            if(!foundList){
                //Create new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save(function(){
                    res.redirect("/" + customListName);
                });
                
            }else{
                //Show an existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        }else{
            console.log(err);
        }
    });

    
});

app.get("/about", function (req, res) {
    res.render("about");
});

app.listen(process.env.PORT || 3000, function () {
    console.log("Server started on port 3000");
});
