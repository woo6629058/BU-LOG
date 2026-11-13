package com.bulog.domain.exhibit.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.bulog.domain.exhibit.repository.LocalExhibitRepository;
import java.net.URI;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class ExhibitQrControllerTest {

    private final ExhibitQrController controller = new ExhibitQrController(new LocalExhibitRepository());

    @Test
    void 있는_유물이면_유물_상세_화면으로_보낸다() {
        ResponseEntity<Void> response = controller.openExhibit("ongi1-faith-jar");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FOUND);
        assertThat(response.getHeaders().getLocation())
                .isEqualTo(URI.create("/pages/exhibit.html?id=ongi1-faith-jar"));
    }

    @Test
    void 없는_유물이면_홈으로_보낸다() {
        ResponseEntity<Void> response = controller.openExhibit("unknown-exhibit");

        assertThat(response.getHeaders().getLocation()).isEqualTo(URI.create("/"));
    }

    @Test
    void 형식이_맞지_않는_주소는_조회하지_않고_홈으로_보낸다() {
        ResponseEntity<Void> response = controller.openExhibit("../../etc");

        assertThat(response.getHeaders().getLocation()).isEqualTo(URI.create("/"));
    }
}
