import { Express } from 'express';
import { createApp } from '../../src/app';

export const getTestApp = (): Express => {
  return createApp();
};

