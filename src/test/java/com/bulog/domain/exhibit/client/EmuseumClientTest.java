package com.bulog.domain.exhibit.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bulog.domain.exhibit.exception.ExhibitException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

class EmuseumClientTest {

    @Test
    void JPEG_이미지_응답을_허용한다() {
        byte[] content = {1, 2, 3};
        ResponseEntity<byte[]> response = ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(content);

        EmuseumImage image = EmuseumClient.validateImageResponse(response);

        assertThat(image.contentType()).isEqualTo(MediaType.IMAGE_JPEG);
        assertThat(image.content()).containsExactly(content);
    }

    @Test
    void 이미지가_아닌_응답은_거부한다() {
        ResponseEntity<byte[]> response = ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(new byte[]{1});

        assertThatThrownBy(() -> EmuseumClient.validateImageResponse(response))
                .isInstanceOf(ExhibitException.class)
                .hasMessage("e뮤지엄 서비스를 일시적으로 이용할 수 없습니다.");
    }

    @Test
    void 와일드카드_이미지_타입은_거부한다() {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_TYPE, "image/*");
        ResponseEntity<byte[]> response = new ResponseEntity<>(
                new byte[]{1},
                headers,
                HttpStatus.OK
        );

        assertThatThrownBy(() -> EmuseumClient.validateImageResponse(response))
                .isInstanceOf(ExhibitException.class)
                .hasMessage("e뮤지엄 서비스를 일시적으로 이용할 수 없습니다.");
    }

    @Test
    void 빈_이미지_응답은_거부한다() {
        ResponseEntity<byte[]> response = ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(new byte[0]);

        assertThatThrownBy(() -> EmuseumClient.validateImageResponse(response))
                .isInstanceOf(ExhibitException.class)
                .hasMessage("e뮤지엄 서비스를 일시적으로 이용할 수 없습니다.");
    }

    @Test
    void Content_Type이_없는_응답은_거부한다() {
        ResponseEntity<byte[]> response = ResponseEntity.ok(new byte[]{1});

        assertThatThrownBy(() -> EmuseumClient.validateImageResponse(response))
                .isInstanceOf(ExhibitException.class)
                .hasMessage("e뮤지엄 서비스를 일시적으로 이용할 수 없습니다.");
    }
}
