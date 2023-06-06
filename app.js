const fs  = require('fs');
const express = require('express');

const app = express();
// middleware
app.use(express.json())

const port = process.env.PORT || 3000; 

//  we read the file here because we want to read it only once when the server starts and not every time we make a request
const tours = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`))

app.get('/api/v1/tours', (req,res)=>{
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            // we can just write tours because it is the same as tours: tours
            tours
        }
    })
})


app.post('/api/v1/tours', (req,res) =>{
    const newId = tours[tours.length-1].id + 1
    const newTour = Object.assign({id:newId}, req.body)

    tours.push(newTour)
    fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err => {
        res.status(201).json({
            status:"success",
            data:{
                tour:newTour
            }
        })
    })
})


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});