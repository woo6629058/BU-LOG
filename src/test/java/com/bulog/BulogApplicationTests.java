package com.bulog;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.web.client.RestClient;

@SpringBootTest
class BulogApplicationTests {

	@Autowired
	private ApplicationContext applicationContext;

	@Test
	void contextLoads() {
	}

	@Test
	void restClientBuilder는_요청할_때마다_새로_생성된다() {
		RestClient.Builder firstBuilder = applicationContext.getBean(RestClient.Builder.class);
		RestClient.Builder secondBuilder = applicationContext.getBean(RestClient.Builder.class);

		assertThat(firstBuilder).isNotSameAs(secondBuilder);
	}

}
