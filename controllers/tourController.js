const fs  = require('fs');
//  we read the file here because we want to read it only once when the server starts and not every time we make a request
const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`))

exports.checkId = (req,res,next,value) => {
     // convert the string to a number
     const id = req.params.id *1
     console.log(`ID is ${value}`);
     if (id > tours.length){
         return res.status(404).json({
             status:"unsuccessful",
             message:"Invalid ID"
         })
     }
     next()
}

exports.getAllTours = (req,res)=>{
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            // we can just write tours because it is the same as tours: tours
            tours
        }
    })
}

exports.getTour = (req,res)=>{
   
    const id = req.params.id * 1
    // find creates a new array with the elements that pass the test
    const tour  = tours.find(t => t.id===id)

    res.status(200).json({
        status:"success",
        tour
    })
}

exports.createTour = (req,res) =>{
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

exports.updateTour = (req,res)=>{
   res.status(200).json({
         status:"success",
            data:{
                tour:"<Updated tour here...>"
            }
   })

}

exports.deleteTour = (req,res)=>{
    res.status(204).json({
        status:"success",
        data:null
    })
}
