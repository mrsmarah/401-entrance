'use strict';

require('dotenv').config();
const express = require('express');
const pg = require ('pg');
const methodOverride = require ('method-override');
const superagent = require('superagent');
const PORT = process.env.PORT || 4000;
const app = express();
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error',(err)=> console.log(err));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public')); 
app.set('view engine', 'ejs');

app.get('/',(req,res)=>{
    superagent.get('https://digimon-api.herokuapp.com/api/digimon')
    .then ((results)=>{
        const dataArr = results.body.map((data)=>{
            return new Digimon(data);
        });
        res.render('show.ejs',{ item : dataArr});
    })
    .catch((err)=>errorHandler(err,req,res));
})

app.post('/add',(req,res)=>{
    const SQL = 'SELECT name FROM digimon WHERE name=$1;';
    const values = [req.body.name];
    client.query(SQL,values).then((results)=>{
        if(results.rows.length > 0){
            res.redirect('/');
        }else{
            const SQL ='INSERT INTO digimon (name,img,level) VALUES ($1,$2,$3);';
            const values = [req.body.name,req.body.img,req.body.level];
            client.query(SQL,values).then((results)=>{
                res.redirect('/');
            })
            .catch((err)=>errorHandler(err,req,res));
        }
       
    }).catch((err)=>errorHandler(err,req,res));
})

app.get('/favorites',(req,res)=>{
    const SQL = 'SELECT * FROM digimon;';
    client.query(SQL).then((results)=>{
        res.render('favorites.ejs',{ item : results.rows});
    }).catch((err)=>errorHandler(err,req,res));
});

app.get('/details/:id',(req,res)=>{
    const SQL = 'SELECT * FROM digimon WHERE id=$1;';
    const values = [req.params.id];
    client.query(SQL,values).then((results)=>{
        res.render('details.ejs',{ item : results.rows[0]});
    }).catch((err)=>errorHandler(err,req,res));
});

app.put('/update/:id',(req,res)=>{
    const SQL = 'UPDATE digimon SET name=$1,img=$2,level=$3 WHERE id=$4;';
    const values = [req.body.name, req.body.img,req.body.level ,req.params.id];
    client.query(SQL,values).then((results)=>{
        res.redirect(`/details/${req.params.id}`)
    }).catch((err)=>errorHandler(err,req,res));
});


app.get('/edit/:id',(req,res)=>{
    const SQL = 'SELECT * FROM digimon WHERE id=$1;';
    const values = [req.params.id];
    client.query(SQL,values).then((results)=>{
        res.render('edit.ejs',{ item : results.rows[0]});
    }).catch((err)=>errorHandler(err,req,res));
});

app.delete('/delete/:id',(req,res)=>{
    const SQL = 'DELETE FROM digimon WHERE id=$1;';
    const values = [req.params.id];
    client.query(SQL,values).then((results)=>{
        res.redirect('/');
    }).catch((err)=>errorHandler(err,req,res));
});  


app.use('*',notfound);
app.use(errorHandler);
 
function notfound(req,res){
    res.status(404).send('not found');
} 
function errorHandler(err,req,res){
    res.status(500).send(err);
}

client.connect().then(()=>{
    app.listen(PORT,()=> console.log (`server is on ${PORT}`));
});

function Digimon(data){
    this.name=data.name;
    this.img=data.img;
    this.level=data.level; 

}