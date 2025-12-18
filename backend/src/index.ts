/**
 * Azure Functions Entry Point
 * Exporte toutes les fonctions Azure pour l'application
 */

import { app } from '@azure/functions';

// Import all function handlers
import './functions/user.js';
import './functions/image.js';
import './functions/album.js';

// Optional: Application-level startup logic can be added here
console.log('Azure Functions app initialized');

export { app };

