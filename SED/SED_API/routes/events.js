const { getEvents, getMyEvents, createEvent, editEvent, deleteEvent } = require('../controllers/eventsController');
const { authenticate } = require('../middlewares/auth');

function eventRoutes(req, res, parsedUrl, method) {
    authenticate(req, res, (decoded) => {
        if (parsedUrl.pathname === '/events' && method === 'GET') {
            getEvents(req, res);
        } else if (parsedUrl.pathname === '/events/my' && method === 'GET') {
            getMyEvents(req, res, decoded);
        } else if (parsedUrl.pathname === '/events' && method === 'POST') {
            createEvent(req, res, decoded);
        } else if (parsedUrl.pathname === '/events/edit' && method === 'POST') {
            editEvent(req, res, decoded);
        } else if (parsedUrl.pathname === '/eventsDelete' && method === 'DELETE') {
            deleteEvent(req, res, decoded); 
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Ruta no encontrada' }));
        }
    });
}

module.exports = eventRoutes;
