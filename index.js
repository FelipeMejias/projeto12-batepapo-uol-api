import express ,{json} from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import dayjs from 'dayjs'
const app=express()
app.use(cors())
app.use(json())

const mongoClient = new MongoClient("mongodb://localhost:27017");
let db;

function buscarHorario(){
    const str=dayjs().format()
    const horario=str[11]+str[12]+str[13]+str[14]+str[15]+str[16]+str[17]+str[18]
    return horario
}
buscarHorario()
app.post('/participants', async (req,res)=>{
    const {name}=req.body
    try{
        await mongoClient.connect()
        db=mongoClient.db('my_bank')
        await db.collection('usuarios').insertOne({
            name:name,
            lastStatus: Date.now()
        })
        res.status().send()
        mongoClient.close()
    }catch(e){
        res.status().send('',e)
        mongoClient.close()
    }
})
app.get('/participants', async (req,res)=>{
    
    try{
        await mongoClient.connect()
        db=mongoClient.db('my_bank')
        const todosUsuarios= await db.collection("usuarios").find({}).toArray()
        res.status().send(todosUsuarios)
        mongoClient.close()
    }catch(e){
        res.status().send('',e)
        mongoClient.close()
    }
})


app.post('/messages', async (req,res)=>{
    const {to,text,type}=req.body
    const usuario=req.headers.user
    try{
        await mongoClient.connect()
        db=mongoClient.db('my_bank')
        await db.collection('mensagens').insertOne({
            to,text,type,
            from:usuario,
            time:buscarHorario()
        })
        res.sendStatus(201)
        mongoClient.close()
    }catch(e){
        res.status().send('',e)
        mongoClient.close()
    }
})
app.get('/messages', async (req,res)=>{
    const limite =parseInt(req.query.limit)
    const usuario=req.headers.user
    try{
        await mongoClient.connect()
        db=mongoClient.db('my_bank')

        
        mongoClient.close()
    }catch(e){
        res.status().send('',e)
        mongoClient.close()
    }
})



app.post('/status', async (req,res)=>{
    const usuario=req.headers.user
    try{
        await mongoClient.connect()
        db=mongoClient.db('my_bank')
        await db.collection('usuarios').updateOne({name:usuario},{$set:{ lastStatus: Date.now()}})
        
        mongoClient.close()
    }catch(e){
        res.status().send('',e)
        mongoClient.close()
    }
})
app.listen(5000)