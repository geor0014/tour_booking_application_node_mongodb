const fs  = require('fs');
const express = require('express');
const { get } = require('http');

const app = express();
// middleware
app.use(express.json())

const port = process.env.PORT || 3000; 

//  we read the file here because we want to read it only once when the server starts and not every time we make a request
const tours = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`))

const getAllTours = (req,res)=>{
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            // we can just write tours because it is the same as tours: tours
            tours
        }
    })
}

const getTour = (req,res)=>{
    // convert the string to a number
    const id = req.params.id * 1

    if (id > tours.length){
        return res.status(404).json({
            status:"unsuccessful",
            message:"Invalid ID"
        })
    }
    // find creates a new array with the elements that pass the test
    const tour  = tours.find(t => t.id===id)

    res.status(200).json({
        status:"success",
        tour
    })
}

const createTour = (req,res) =>{
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
}

const updateTour = (req,res)=>{
    if (req.params.id * 1 > tours.length){
        return res.status(404).json({
            status:"unsuccessful",
            message:"Invalid ID"
        })
    }

   res.status(200).json({
         status:"success",
            data:{
                tour:"<Updated tour here...>"
            }
   })

}

const deleteTour = (req,res)=>{
    if (req.params.id * 1 > tours.length){
        return res.status(404).json({
            status:"unsuccessful",
            message:"Invalid ID"
        })
    }

    res.status(204).json({
        status:"success",
        data:null
    })
}

app.route('/api/v1/tours').get(getAllTours).post(createTour)
app.route('/api/v1/tours/:id').get(getTour).patch(updateTour).delete(deleteTour)

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});