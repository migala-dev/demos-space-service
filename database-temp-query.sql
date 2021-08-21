CREATE TABLE users (
    user_id SERIAL,
    name varchar(255),
    phone_number varchar(255) not null,
    profile_picture_key varchar(255),
    cognito_id varchar(255),
    created_at timestamp not null default CURRENT_TIMESTAMP,
    updated_at timestamp not null default CURRENT_TIMESTAMP,
	PRIMARY KEY(user_id)
);