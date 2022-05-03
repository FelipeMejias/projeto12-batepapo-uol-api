import express ,{json} from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import dayjs from 'dayjs'
import dotenv from 'dotenv'
import joi from 'joi'
const app=express()
app.use(cors())
app.use(json())
dotenv.config()

const mongoClient = new MongoClient("mongodb://localhost:27017");
await mongoClient.connect()
const db=mongoClient.db(process.env.BANCO)

function buscarHorario(){
    const str=dayjs().format()
    const horario=str[11]+str[12]+str[13]+str[14]+str[15]+str[16]+str[17]+str[18]
    return horario
}

app.post('/participants', async (req,res)=>{
    const {name}=req.body
    const skema=joi.string().required()
    const validacao=skema.validate(name)
    if(validacao.error){res.sendStatus(422);return}

    const existente=await db.collection('usuarios').findOne({name:name})
    if(existente){res.sendStatus(409);return}

    try{
        await db.collection('usuarios').insertOne({
            name:name,
            lastStatus: Date.now()
        })
        await db.collection('mensagens').insertOne({
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: buscarHorario()
        })
        res.sendStatus(201)
        
    }catch(e){
        res.sendStatus(500)
      
    }
})


app.get('/participants', async (req,res)=>{
    
    try{
        const todosUsuarios= await db.collection("usuarios").find({}).toArray()
        res.send(todosUsuarios)
    }catch(e){
        res.sendStatus(500)
        
    }
})


app.post('/messages', async (req,res)=>{
    const body=req.body
    const usuario=req.headers.user
    const skema=joi.object({
        to:joi.string().required(), 
        text:joi.string().required(),
        type:joi.string().required()
    })
    const validacao=skema.validate(body)
    const tipoCerto=(body.type== 'message' || body.type=='private_message')
    const existente=await db.collection('usuarios').findOne({name:usuario})
    if(!existente || validacao.error || !tipoCerto ){res.sendStatus(409);return}
    try{
        await db.collection('mensagens').insertOne({
            ...body,
            from:usuario,
            time:buscarHorario()
        })
        res.sendStatus(201)
    }catch(e){
        res.sendStatus(500)
    }
})


app.get('/messages', async (req,res)=>{
    const limite =parseInt(req.query.limit)
    const usuario=req.headers.user
    try{
        const todasMensagens= await db.collection("mensagens").find({}).toArray()
        const mensagensCertas=todasMensagens.filter(msg=>{
            if(msg.type=='private_message'){
            if(msg.to!=usuario && msg.from!=usuario){
                return false}}
            return true})
        mensagensCertas.splice(0,mensagensCertas.length-limite)
        res.send(mensagensCertas)
        
    }catch(e){
        res.sendStatus(500)
    }
})


app.post('/status', async (req,res)=>{
    const usuario=req.headers.user
    const existente=await db.collection('usuarios').findOne({name:usuario})
    if(!existente ){res.sendStatus(404);return}
    try{
        await db.collection('usuarios').updateOne({name:usuario},{$set:{ lastStatus: Date.now()}})
        res.sendStatus(200)

    }catch(e){
        res.sendStatus(500)

    }
})

setInterval(async()=>{
    try{
        const todosUsuarios= await db.collection("usuarios").find({}).toArray()
        todosUsuarios.forEach(usuario => {
            const corte=parseInt(Date.now())-10010
            if(usuario.lastStatus<corte){
                 db.collection("usuarios").deleteOne({name:usuario.name})
                 db.collection("mensagens").insertOne({
                    from: usuario.name,
                    to: 'Todos',
                    text: 'sai da sala...',
                    type: 'status',
                    time: buscarHorario()
                })
            }
        });
        
    }catch(e){
        
    }
},15000)


app.listen(5000)