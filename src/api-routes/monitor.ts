/*
 *  API: Monitor routes
 */
import { Router } from "express";
import { humidityMonitorData, lightingMonitorData, temperatureMonitorData } from "..";
const router = Router();

/* Get the temperature measurement data */
router.get('/temperature', (req:any, res:any)=>{
    return res.send(temperatureMonitorData);
});

/* Get the humidity measurement data */
router.get('/humidity', (req:any, res:any)=>{
    return res.send(humidityMonitorData);
});

/* Get the lighting measurement data */
router.get('/lighting', (req:any, res:any)=>{
    return res.send(lightingMonitorData);
});

export default router;