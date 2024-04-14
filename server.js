const express = require("express");
const app = express();
const fs = require('fs');
const multer = require('multer');
const Joi = require('joi');
const cors = require('cors');
const mongoose = require('mongoose');

app.use(express.static("public"));
app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://localhost/crafts', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage }).single('itemImage');

const craftsSchema = Joi.object({
    itemName: Joi.string().required(),
    itemDescription: Joi.string().required(),
    supply: Joi.array().items(Joi.string()).required()
});

app.get("/api/crafts", async (req, res) => {
    try {
        const data = await fs.promises.readFile('crafts.json', 'utf8');
        const crafts = JSON.parse(data);
        res.json(crafts);
    } catch (err) {
        console.error("Error reading crafts.json:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/api/addItem', upload, async (req, res) => {
    const { error } = craftsSchema.validate(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }
  
    const { itemName, itemDescription, supply } = req.body;
    const newItem = new Craft({
      name: itemName,
      description: itemDescription,
      image: req.file.filename,
      supplies: supply,
    });
  
    try {
      await newItem.save();
      res.status(200).send('Item added successfully');
    } catch (err) {
      console.error('Error adding item:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

  app.put('/api/crafts/:name', upload, async (req, res) => {
    const { name } = req.params;
    const { itemName, itemDescription, supply } = req.body;
  
    try {
      const craft = await Craft.findOneAndUpdate(
        { name: name },
        {
          name: itemName,
          description: itemDescription,
          image: req.file ? req.file.filename : undefined,
          supplies: supply,
        },
        { new: true }
      );
  
      if (craft) {
        res.status(200).send('Craft updated successfully');
      } else {
        res.status(404).send('Craft not found');
      }
    } catch (err) {
      console.error('Error updating craft:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

  app.delete('/api/crafts/:name', async (req, res) => {
    const { name } = req.params;
  
    try {
      const craft = await Craft.findOneAndDelete({ name: name });
  
      if (craft) {
        res.status(200).send('Craft deleted successfully');
      } else {
        res.status(404).send('Craft not found');
      }
    } catch (err) {
      console.error('Error deleting craft:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  


app.listen(3000, () => {
    console.log("Listening on port 3000");
});