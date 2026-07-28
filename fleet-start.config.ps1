# Per-repo fleet start config for worldlabs-mcp
# Edit ports/backend target here - start.ps1 is fleet-standard.
@{
    Name         = 'worldlabs-mcp'
    BackendPort  = 10865
    FrontendPort = 10864
    HealthPath   = '/health'
    WebRoot      = 'D:\Dev\repos\worldlabs-mcp\web_sota'
    Backend = @{
        Kind          = 'uvicorn'
        UvicornTarget = 'worldlabs_mcp.server:app'
        SyncExtras    = @('dev')
        Env           = @{ WEB_PORT = '10865' }
    }
    Frontend = @{
        Kind           = 'vite-npm'
        PackageManager = 'npm'
        PortEnvVar     = 'VITE_PORT'
        ApiTargetEnv   = 'VITE_API_TARGET'
    }
}
