// Mock environment variables
process.env.NODE_ENV = 'development';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.PAREAZUL_API_WEBSERVICE = 'https://test-api.pareazul.com';
process.env.PAREAZUL_API_BACKEND = 'https://test-backend.pareazul.com';
process.env.API_SECRET_KEY = 'test-secret-key';
process.env.SESSION_TTL = '3600';
process.env.MEMORY_BUFFER_SIZE = '20';
