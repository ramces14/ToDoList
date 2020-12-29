require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Adding items to the Database
const password = process.env.PASSWORD;
mongoose.connect(`mongodb+srv://admin-ramces:${password}@cluster0.3xnwt.mongodb.net/todolistDB`, {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = { name: String };

const Item = mongoose.model("Item", itemsSchema);

const milk = new Item({
  name: "Welcome to your todolist!",
});

const cheese = new Item({
  name: "Hit the + button to add a new item",
});

const bread = new Item({
  name: "check the checkbox to delete an item",
});

const groceries = [milk, cheese, bread];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

// End of the Database

app.get("/", function(req, res) {

  Item.find({}, (err, foundItems) => {

    if (foundItems.length === 0) {
      Item.insertMany(groceries, (err) =>{
        if (err) {
          console.log(err);
        } else {
          console.log("Success!");
        }

      });
      // This redirects and adds the items to the list
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.get("/:paramName", function(req,res){
  const customName = _.capitalize(req.params.paramName);

  List.findOne({name: customName}, (err, foundList) =>{
    if (!err) {
      if (!foundList) {
        // Create a new List
        const list = new List ({
          name: customName,
          items: groceries
        });
      
        list.save();

        res.redirect(`/${customName}`)
      } else {
        // Show an existing List
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });


});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const addedItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    addedItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(addedItem);
      foundList.save();
      res.redirect(`/${listName}`)
    });
  }

});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today" ) {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log("Item has been removed")
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
      if (!err){
        res.redirect(`/${listName}`);
      }
    });
  }

});


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});
