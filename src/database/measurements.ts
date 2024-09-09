/*
 *  Schemas for the MongoDB database
 */

import Datastore from 'nedb';
import * as path from 'path';

const MAX_DOCUMENTS_PER_TYPE = 4320;

// Initialize the database
const db = new Datastore({ filename: path.join(__dirname, 'measurements.db'), autoload: true });

// Define the Measurement type
interface Measurement {
    type: string;
    min: number;
    max: number;
    time: number;  // UNIX timestamp
    value: number;
}

// Get measurements
export function getMeasurements(type: string) {
    return new Promise((resolve, reject)=>{
        db.find({ type }).sort({ time: 1 }).exec((err, docs) => {
            if (err) {
                console.error('Error retrieving measurements:', err);
                return reject(err)
            } else {
                console.log('Measurements retrieved:', docs);
                return resolve(docs);
            }
        });
    });
}

// Function to insert a new measurement, removing the oldest one if necessary
export function saveMeasurement(type: string, min: number, max: number, value: number, time: number): void {
    // Count the number of existing documents of the given type
    db.count({ type }, (err, count) => {
        if (err) {
            console.error('Error counting documents:', err);
            return;
        }

        if (count >= MAX_DOCUMENTS_PER_TYPE) {
            // Remove the oldest document (based on time field)
            db.find({ type }).sort({ time: 1 }).limit(1).exec((err, docs) => {
                if (err) {
                    console.error('Error finding oldest document:', err);
                    return;
                }

                if (docs.length > 0) {
                    db.remove({ _id: docs[0]._id }, {}, (err) => {
                        if (err) {
                            console.error('Error removing document:', err);
                        } else {
                            console.log(`Oldest measurement of type "${type}" removed.`);
                        }
                    });
                }
            });
        }

        // Insert the new measurement
        const measurement: Measurement = { type, min, max, time, value };
        db.insert(measurement, (err, newDoc) => {
            if (err) {
                console.error('Error inserting measurement:', err);
            } else {
                console.log('Measurement inserted:', newDoc);
            }
        });
    });
}