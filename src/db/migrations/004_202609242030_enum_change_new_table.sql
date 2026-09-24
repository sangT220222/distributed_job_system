ALTER TYPE status ADD VALUE 'processing';

CREATE TABLE outbox_events(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),    
    job_id UUID NOT NULL REFERENCES jobs(id),
    event_type VARCHAR(255) DEFAULT 'job_created',
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)