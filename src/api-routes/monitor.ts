/*
 *  API: Monitor routes
 */
import { Router } from "express";
import { getMeasurements } from "../database/measurements";
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

export default router;