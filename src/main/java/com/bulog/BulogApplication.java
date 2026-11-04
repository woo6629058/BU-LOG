package com.bulog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class BulogApplication {

	public static void main(String[] args) {
		SpringApplication.run(BulogApplication.class, args);
	}

}
