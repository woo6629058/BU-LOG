package com.bulog.domain.exhibit.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bulog.domain.exhibit.exception.ExhibitException;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

class EmuseumClientTest {

    @Test
    void JPEG_시그니처가_있으면_헤더와_관계없이_허용한다() {
        byte[] content = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
        ResponseEntity<byte[]> response = ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(content);

        EmuseumImage image = EmuseumClient.validateImageResponse(response);

        assertThat(image.contentType()).isEqualTo(MediaType.IMAGE_JPEG);
        assertThat(image.content()).containsExactly(content);
    }

    @Test
    void PNG_시그니처가_있으면_Content_Type이_없어도_허용한다() {
        byte[] content = {
                (byte) 0x89, 0x50, 0x4E, 0x47,
                0x0D, 0x0A, 0x1A, 0x0A
        };
        ResponseEntity<byte[]> response = ResponseEntity.ok(content);

        EmuseumImage image = EmuseumClient.validateImageResponse(response);

        assertThat(image.contentType()).isEqualTo(MediaType.IMAGE_PNG);
        assertThat(image.content()).containsExactly(content);
    }

    @Test
    void 이미지_헤더여도_본문_시그니처가_잘못되면_거부한다() {
        ResponseEntity<byte[]> response = ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(new byte[]{1, 2, 3});

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
}
