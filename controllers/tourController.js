//  we read the file here because we want to read it only once when the server starts and not every time we make a request
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`))
const Tour = require('./../models/tourModel')


exports.getAllTours = async (req,res)=>{
    try{

        const tours = await Tour.find()
        
        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: {
                tours
            }
        })
    }catch(err){
        res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
}

exports.getTour = async (req,res)=>{
   try{
    const tour = await Tour.findById(req.params.id)
    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    })
   }catch(err){
    res.status(400).json({
        status: 'fail',
        message: err.message
    })
   }
 
}

exports.createTour = async (req,res) =>{
    try{
    const tour = await Tour.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
            tour
        }
    });  
    }catch(err){
        res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
}

exports.updateTour = (req,res)=>{


}

exports.deleteTour = (req,res)=>{
   
}
