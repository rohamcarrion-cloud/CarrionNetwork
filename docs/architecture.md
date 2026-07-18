# Carrion Networks Architecture

## Overview

Carrion Networks is organized as an npm workspace monorepo containing a React
frontend and PocketBase backend.

## Applications

flowchart LR
    U[User] --> W[React and Vite Web App]
    W --> S[Frontend Service Layer]
    S --> P[PocketBase API]
    P --> A[Authentication]
    P --> C[Collections]
    P --> H[Hooks]
    P --> M[Migrations]

### Web Application

Location:

```text
apps/web