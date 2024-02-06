#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MoviesStack } from '../lib/movies-stack';

const app = new cdk.App();
new MoviesStack(app, 'MoviesStack', {
  env: { account: '948425373830', region: 'us-east-1' }
});
