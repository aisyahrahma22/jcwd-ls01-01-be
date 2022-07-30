const express = require('express');
const cors = require('cors');
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;
app.use(cors());

const db = require('./Connection/Connection');

const UserRouters = require('./Routers/UserRouters');
const ProductRouters = require('./Routers/ProductRouters');
const TransactionRouters = require('./Routers/TransactionRouters');
const AdminRouters = require('./Routers/AdminRouters');
const RajaOngkir = require('./Routers/RajaOngkirRoute');

app.get("/", (req, res) => {
  res.status(200).send("<h1>API Server JCWDLS001-01</h1>");
});

app.use('/admin', AdminRouters);
app.use('/user', UserRouters);
app.use('/product', ProductRouters);
app.use('/transaction', TransactionRouters);
app.use('/rajaongkir', RajaOngkir);

app.use('/Public/', express.static(__dirname + '/Public'));

app.listen(PORT, () => console.log('API Server JCWDLS001-01 Running on PORT ' + PORT));
