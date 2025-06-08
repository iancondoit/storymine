import { Router } from 'express';
import * as entityController from '../controllers/entityController';

const router = Router();

/**
 * @route   GET /api/entities
 * @desc    Get list of entities with pagination
 * @access  Public
 */
router.get('/', entityController.getEntities);

/**
 * @route   GET /api/entities/type/:type
 * @desc    Get entities by type
 * @access  Public
 */
router.get('/type/:type', entityController.getEntities);

/**
 * @route   GET /api/entities/:id
 * @desc    Get a single entity by ID
 * @access  Public
 */
router.get('/:id', entityController.getEntity);

/**
 * @route   GET /api/entities/:id/relationships
 * @desc    Get relationships for an entity
 * @access  Public
 */
router.get('/:id/relationships', entityController.getEntityRelationships);

/**
 * @route   GET /api/entities/:id/network
 * @desc    Get network of related entities
 * @access  Public
 */
router.get('/:id/network', entityController.getEntityNetwork);

export default router; 