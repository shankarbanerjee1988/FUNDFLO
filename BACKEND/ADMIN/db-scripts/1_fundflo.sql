CREATE SCHEMA IF NOT EXISTS fundflo;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Modules Table
CREATE TABLE IF NOT EXISTS fundflo.modules (
	id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
	module_code varchar(20) NOT NULL UNIQUE CHECK (module_code IN ('AR','DMS','AP','NOTIFICATION','CF','ADMIN')),
	module_name varchar(255) NOT NULL,
	is_active boolean NOT NULL DEFAULT false, 
	in_mobile boolean NOT NULL DEFAULT true, 
	in_web boolean NOT NULL DEFAULT true, 
	updated_date timestamptz DEFAULT now(),
	updated_by_text text NULL
);

-- Sub Modules Table
CREATE TABLE IF NOT EXISTS fundflo.sub_modules (
	id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
	module_uuid UUID NOT NULL REFERENCES fundflo.modules(id) ON DELETE CASCADE,
	sub_module_code varchar(20) NOT NULL,
	sub_module_name varchar(255) NOT NULL,
	is_active boolean NOT NULL DEFAULT false, 
	in_mobile boolean NOT NULL DEFAULT true, 
	in_web boolean NOT NULL DEFAULT true, 
	updated_date timestamptz DEFAULT now(),
	updated_by_text text NULL,
	CONSTRAINT uqidx_fundflo_sub_modules UNIQUE (module_uuid, sub_module_code)
);

-- Roles Table
CREATE TABLE IF NOT EXISTS fundflo.roles (
	id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
	module_uuid UUID NOT NULL REFERENCES fundflo.modules(id) ON DELETE CASCADE,
	sub_module_uuid UUID NOT NULL REFERENCES fundflo.sub_modules(id) ON DELETE CASCADE,
	role_code varchar(20) NOT NULL,
	role_name varchar(255) NOT NULL,
	is_active boolean NOT NULL DEFAULT false, 
	updated_date timestamptz DEFAULT now(),
	updated_by_text text NULL,
	CONSTRAINT uqidx_fundflo_roles UNIQUE (module_uuid, sub_module_uuid, role_code)
);

-- App Version Table
CREATE TABLE IF NOT EXISTS fundflo.app_version (
	id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
	app_name text NOT NULL UNIQUE,

	android_app_id text NULL,
	android_bundle_id text NULL,
	android_version text NULL,
	android_identifier text NULL,
	android_url text NULL,
	play_app_id text NULL,

	ios_app_id text NULL,
	ios_bundle_id text NULL,
	ios_version text NULL,
	ios_identifier text NULL,
	ios_url text NULL,
	itune_app_id text NULL,

	updated_date timestamptz DEFAULT now(),
	updated_by_text text NULL
);

-- Indexing for Performance
CREATE INDEX idx_fundflo_modules_code ON fundflo.modules (module_code);
CREATE INDEX idx_fundflo_sub_modules_code ON fundflo.sub_modules (sub_module_code);
CREATE INDEX idx_fundflo_roles_code ON fundflo.roles (role_code);