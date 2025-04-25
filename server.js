const http=require("http");
const fs=require("fs");
const fsPromises=require("fs/promises");
const  path=require("path");
const url=require("url");

const{MongoClient}= require("mongodb");
const serverPort=7000;
const dbName="Finance";
const clientCollection="clients";
const historyCollection="history";
const mongoUrl="mongodb://localhost:27017";
const { ObjectId } = require("mongodb");


let db;
let collection;
let history;
async function mongoConnect(){
    try{
        const client=new MongoClient(mongoUrl,{useNewUrlParser:true,useUnifiedTopology:true});
        await client.connect();
        db=client.db(dbName);
        collection=db.collection(clientCollection);
        history=db.collection(historyCollection);
        console.log("Connected to MongoDB");
    }
    catch(error){
        console.error("Error connecting to MongoDB:",error);
    }
}
mongoConnect();

const server=http.createServer((req,res)=>{
    const pathName=req.url;
    const dir=path.join(__dirname);
    const method=req.method;
    const filePath=path.join(dir,pathName);
    const ext=path.extname(pathName);
    
    let contentType="text/plain";

    if(ext===".html"){
        contentType="text/html";
    }
    else if(ext===".css"){
        contentType="text/css";
    }
    else if(ext===".js"){
        contentType="text/javascript";
    }

    if(pathName=="/index.html" || pathName=="/signup.html" || pathName=="/login.html" || pathName=="/home.html" || pathName=="/history.html"){
    
        fs.readFile(filePath,(err,data)=>{
            if(err){
                res.writeHead(404,{"Content-Type":"text/plain"});
                res.end("404 Not Found");
            }
            else{
                res.writeHead(200,{"Content-Type":contentType});
                res.end(data);
            }
        })
    }
    else if(pathName=="/signup" && method=="POST"){
        let body="";
        req.on("data",chunk=>{
            body+=chunk.toString();
        })
        req.on("end",async()=>{
            try{
                console.log("Received data:", body); // Log the received data
                const details=JSON.parse(body);
                const result=await collection.insertOne(details);
                res.writeHead(200,{"Content-Type":"application/json"});
                res.end(JSON.stringify({id:result.insertedId}));
                console.log("Client details successfully added to MongoDB",result.insertedId);
            }
            catch(error){
                res.writeHead(404,{"Content-Type":"text/plain"});
                res.end("404 Not Found");
        }
        })
    }
    else if(pathName==="/login" && method==="POST"){
        let body="";

        req.on("data",chunk=>{
            console.log(chunk.toString());
            body+=chunk.toString();
        })
        
        req.on("end",async()=>{
            try{
                console.log(`Body==${body}`);
                const array=JSON.parse(body);
                console.log(array);
                let array1;
                console.log(array1);
                let userAcc=[];
                for(let i=0;i<array.length;i++){
                    array1 = await collection.findOne({ _id: new ObjectId(array[i].id) },{projection:{email:1,_id:0,password:1}});
                    if(array1){
                        userAcc.push(array1);
                    }
                    
                }
                
                res.writeHead(200,{"Content-Type":"application/json"});
                res.end(JSON.stringify(userAcc));
                console.log("User Account Details successfully fetched from MongoDB",userAcc);

            }
            catch(error){
                res.writeHead(500,{"Content-Type":"application/json"});
                res.end(JSON.stringify({err:"Internal Server Error"}));
            } 
        })
    }
    else if(pathName==="/setCurrentDate.html" && method==="POST"){
        let body="";
        req.on("data",chunk=>{
            body+=chunk.toString();
        })
        console.log(body);
        req.on("end",async()=>{
            try{
                const details=JSON.parse(body);

                const doc=await collection.findOne( { email: details.email },{ projection: { currentDate: 1, _id: 0 } });
                if(!doc.currentDate){
                    await collection.updateOne({email:details.email},{$set:{currentDate:details.currentDate}});
                    console.log("Current date added successfully",details.currentDate);
                }
                else{
                    console.log("Current date already exists",doc.currentDate);

                    const prevDate = await collection.findOne({email:details.email},{projection:{currentDate:1,_id:0}});
                    console.log("Previous date fetched successfully",prevDate.currentDate);

                    if(prevDate.currentDate!==details.currentDate){
                        await collection.updateOne({email:details.email},{$set:{dayChange:true}});
                    }
                    else{
                        await collection.updateOne({email:details.email},{$set:{dayChange:false}});
                    }
                }

                await collection.updateOne({email:details.email},{$set:{currentDate:details.currentDate}});
                console.log("Current date updated successfully",details.currentDate);
                res.writeHead(200,{"Content-Type":"application/json"});
                res.end(JSON.stringify({message:"Current date updated successfully"}));
            }
            catch(error){
                res.writeHead(500,{"Content-Type":"application/json"});
                res.end(JSON.stringify({err:"Internal Server Error"}));
            }

        })
    }
    else if(pathName==="/transaction" && method==="POST"){
        let body="";
        req.on("data",chunk=>{
            body+=chunk.toString();
        })
        console.log(body);
        req.on("end",async()=>{
            try{
                const logemail=JSON.parse(body);

                const flag=await collection.findOne({email:logemail},{projection:{dayChange:1,transaction:1,_id:0}});
                console.log(flag);

                if(flag.dayChange===true){
                    await collection.updateOne({email:logemail},{$set:{transaction:{income:0,expense:0,balance:0}}});
                    console.log("Transaction details reset successfully",logemail);
                }

                console.log("email="+logemail);
                const tranc=await collection.findOne({email:logemail},{projection:{currentDate:1,transaction:1,_id:0}});
                console.log(tranc);
                console.log("Transaction details fetched successfully",tranc.currentDate);
                res.writeHead(200,{"Content-Type":"application/json"});
                res.end(JSON.stringify(tranc));
            }
            catch(error){
                res.writeHead(500,{"Content-Type":"application/json"});
                res.end(JSON.stringify({err:"Internal Server Error"}));
            }
        })
    }
    else if(pathName==="/updateTransaction" && method==="POST"){
        let body="";
        req.on("data",chunk=>{
            body+=chunk.toString();
        })
        console.log("Updating transaction = ",body);
        req.on("end",async()=>{
            try{
                const details=JSON.parse(body);
                await collection.updateOne({email:details.logMail},{$set:{transaction:details.transaction}});
                console.log("Transaction updated successfully",details.transaction);
                res.writeHead(200,{"Content-Type":"application/json"});
                res.end(JSON.stringify({message:"Transaction updated successfully"}));
            }
            catch(error){
                res.writeHead(500,{"Content-Type":"application/json"});
                res.end(JSON.stringify({err:"Internal Server Error"}));
            }
        })
    }
    else if(pathName==="/history" && method==="POST"){
        try{
            console.log("History path called");
            let body="";
            req.on("data",chunk=>{
                body+=chunk.toString();
            })
            console.log("history=",body);
            req.on("end",async()=>{
                const details=JSON.parse(body);
                await history.insertOne(details);
                console.log("History details added successfully",details);
                res.writeHead(200,{"Content-Type":"application/json"});
                res.end(JSON.stringify({message:"History details added successfully"}));
            })
        }catch(error){
            res.writeHead(500,{"Content-Type":"application/json"});
            res.end(JSON.stringify({err:"Internal Server Error"}));
        }
    }
})

server.listen(serverPort,"0.0.0.0",()=>{
    console.log(`Server is running on http://localhost:${serverPort}`);
})