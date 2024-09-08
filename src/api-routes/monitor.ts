/*
 *  API: Monitor routes
 */
import { Router } from "express";
const router = Router();


const data = [
    {min:25, max:30, value:25.1},
    {min:25, max:30, value:25.9},
    {min:25, max:30, value:26.4},
    {min:25, max:30, value:25.1},
    {min:25, max:30, value:24.9},
    {min:25, max:30, value:25.1},
    {min:25, max:30, value:25.9},
    {min:25, max:30, value:26.4},
    {min:25, max:30, value:25.1},
    {min:25, max:30, value:24.9}];

/* Get the temperature measurement data */
router.get('/temperature', (req:any, res:any)=>{
    return res.send(data);
});

/* Get the humidity measurement data */
router.get('/humidity', (req:any, res:any)=>{
    return res.send(data);
});

/* Get the lighting measurement data */
router.get('/lighting', (req:any, res:any)=>{
    return res.send(data);
});

export default router;