const { io } = require("socket.io-client");

const socket = io("http://localhost:3009", {
    transports: ["websocket"],
});

socket.on("connect", () => {
  

    // Simuler l'envoi d'une position
    socket.emit("/notification/livreur/position", {
        livreurId: "4c1317da-6f9d-4553-9642-13a4b951f639",
        latitude: 5.345317,
        longitude: -4.024429,
    });

 
});

socket.on("/notification/livreur/position", (data) => {
  
});
