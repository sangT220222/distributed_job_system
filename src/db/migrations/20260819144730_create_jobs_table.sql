CREATE TYPE status AS ENUM ('standby', 'started', 'completed', 'failed');
CREATE TYPE type AS ENUM ('send_email', 'resize_image', 'send_notification');

CREATE TABLE jobs(    
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),    
	job_type type NOT NULL, 
	job_status status NOT NULL DEFAULT 'standby',    
	job_data JSONB NOT NULL,    
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   
	started_at TIMESTAMP NULL,
	finished_at  TIMESTAMP NULL
);