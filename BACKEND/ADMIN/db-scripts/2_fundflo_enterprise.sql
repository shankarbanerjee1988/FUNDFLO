
CREATE SCHEMA IF NOT EXISTS fundflo_enterprise;


CREATE TABLE fundflo_enterprise.enterprise (
	id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
	enterprise_id int NOT NULL UNIQUE,
	enterprise_code varchar(10) NULL UNIQUE,
	enterprise_name text NOT NULL,
	display_name varchar(20) NOT NULL,
    parent_enterprise_id integer,
	is_active bool DEFAULT true NULL,
	

    created_date timestamptz NOT NULL,
    created_by uuid,
	created_by_text text NULL,

	updated_date timestamptz DEFAULT now() NULL,
    updated_by uuid,
	updated_by_text text NULL
);


CREATE TABLE fundflo_enterprise.enterprise_config (
	id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
	enterprise_uuid uuid NOT NULL UNIQUE,
    enterprise_id int NOT NULL UNIQUE,

	web_logo text NOT NULL,
	app_logo text NOT NULL,
	web_banners jsonb,
	app_banners jsonb,
	custom_header jsonb,
	custom_footer jsonb,
	custom_themes jsonb,
	other_configuration jsonb,
	banner_show_as varchar(15) DEFAULT 'enterprise'::character varying NULL,

    created_date timestamptz NOT NULL,
    created_by uuid,
	created_by_text text NULL,
    
	updated_date timestamptz DEFAULT now() NULL,
    updated_by uuid,
	updated_by_text text NULL

	CONSTRAINT enterprise_config_banner_show_as_check CHECK (((banner_show_as)::text = ANY (ARRAY[('enterprise'::character varying)::text, ('company'::character varying)::text, ('pincode'::character varying)::text, ('branch'::character varying)::text]))),
	CONSTRAINT enterprise_config_enterprise_uuid_key UNIQUE (enterprise_uuid),
	CONSTRAINT enterprise_config_enterprise_uuid_fkey FOREIGN KEY (enterprise_uuid) REFERENCES fundflo_admin.enterprise(id) ON DELETE CASCADE,
);