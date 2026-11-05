package com.bulog.domain.exhibit.client;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class EmuseumPropertiesTest {

    @Test
    void 환경변수_앞뒤_공백을_제거한다() {
        EmuseumProperties properties = new EmuseumProperties(
                " http://api.example.com ",
                " service-key ",
                " PS01003464 ",
                1000
        );

        assertThat(properties.baseUrl()).isEqualTo("http://api.example.com");
        assertThat(properties.serviceKey()).isEqualTo("service-key");
        assertThat(properties.institutionCode()).isEqualTo("PS01003464");
    }
}
