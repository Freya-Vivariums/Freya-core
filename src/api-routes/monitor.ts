/*
 *  API: Monitor routes
 */
import { Router } from "express";
import { getMeasurements } from "../database/measurements";
import { humidifierController, lightingController, temperatureController } from "..";
const router = Router();

/* Get the temperature measurement data */
router.get('/temperature', async(req:any, res:any)=>{
    try{
        const result = await getMeasurements('temperature')
        return res.send(result);
    }
    catch(err){
        return res.status(500).send({message:err});
    }
});

/* Get the temperature controller status */
router.get('/temperature/status', async(req:any, res:any)=>{
    try{
        const result = temperatureController.getStatus();
        return res.send(result);
    }
    catch(err){
        return res.status(500).send({message:err});
    }
});


/* Get the humidity measurement data */
router.get('/humidity', async(req:any, res:any)=>{
    try{
        const result = await getMeasurements('humidity')
        return res.send(result);
    }
    catch(err){
        return res.status(500).send({message:err});
    }
});

/* Get the humidity controller status */
router.get('/humidity/status', async(req:any, res:any)=>{
    try{
        const result = humidifierController.getStatus();
        return res.send(result);
    }
    catch(err){
        return res.status(500).send({message:err});
    }
});


/* Get the lighting measurement data */
router.get('/lighting', async(req:any, res:any)=>{
    try{
        const result = await getMeasurements('lighting')
        return res.send(result);
    }
    catch(err){
        return res.status(500).send({message:err});
    }
});

/* Get the lighting controller status */
router.get('/lighting/status', async(req:any, res:any)=>{
    try{
        const result = lightingController.getStatus();
        return res.send(result);
    }
    catch(err){
        return res.status(500).send({message:err});
    }
});


export default router;