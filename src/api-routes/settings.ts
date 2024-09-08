/*
 *  API: Settings routes
 */
import { Router } from "express";
import { configfile } from "..";
import * as fs from 'fs';
const router = Router();

/* Get the settings */
router.get('/', (req:any, res:any)=>{
    const settings = JSON.parse(fs.readFileSync(process.cwd()+'/'+configfile, 'utf8').toString());
    console.log(settings)
    return res.send(settings);
});

/* Update the settings */
router.post('/', (req:any, res:any)=>{
    return res.send({});
})

export default router;