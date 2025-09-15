import axios from 'axios';
import { logger } from '../utils/logger.util';
import { env } from '../config/environment.config';

const axiosLogger = logger.child({ service: 'AxiosHelper' });

const axiosWebservice = axios.create({
    baseURL: env.PAREAZUL_API_WEBSERVICE,
});

axiosWebservice.interceptors.request.use(request => {
    if (!request.headers['Origem-Movimento']) {
        request.headers['Origem-Movimento'] = 'APP';
    }

    axiosLogger.debug(`Making request to: ${request.url}`);
    return request;
});

export default axiosWebservice;
