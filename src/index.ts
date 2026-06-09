import app, {PORT, DUMMY} from "./app";
//importing same variable
import {PORT as API_PORT} from "./configs/constant";
import { connectToMongoDB } from "./database/mongodb";

connectToMongoDB();


app.listen(
    API_PORT, //start backend in this PORT
    () => {
        console.log('Server: http://localhost:${PORT}'); //
    }
);
//execute: npx tsx ==watch index.ts
//http://localhost:8089