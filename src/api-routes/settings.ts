/*
 *  API: Settings routes
 */
import { Router } from "express";
const router = Router();

/* Get the settings */
router.get('/', (req:any, res:any)=>{
    return res.send({});
});

/* Update the settings */
router.post('/', (req:any, res:any)=>{
    return res.send({});
})

export default router;