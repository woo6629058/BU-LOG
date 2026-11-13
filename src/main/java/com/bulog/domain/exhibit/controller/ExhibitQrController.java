package com.bulog.domain.exhibit.controller;

import com.bulog.domain.exhibit.repository.ExhibitCatalog;
import java.net.URI;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * 전시실 QR 주소. QR에는 https://bulog.tech/exhibits/{유물 ID}가 들어간다.
 * 휴대폰 기본 카메라로 찍어도 열리도록, 유물 상세 화면으로 보내 준다. 없는 유물이면 홈으로 보낸다.
 * 화면 파일 위치가 바뀌어도 이곳만 고치면 이미 인쇄한 QR을 그대로 쓸 수 있다.
 */
@Controller
@RequiredArgsConstructor
public class ExhibitQrController {

    private static final Pattern EXHIBIT_ID = Pattern.compile("[a-z0-9-]{1,100}");
    private static final URI HOME = URI.create("/");

    private final ExhibitCatalog exhibitCatalog;

    @GetMapping("/exhibits/{exhibitId}")
    public ResponseEntity<Void> openExhibit(@PathVariable String exhibitId) {
        boolean known = EXHIBIT_ID.matcher(exhibitId).matches()
                && exhibitCatalog.findById(exhibitId).isPresent();
        URI location = known
                ? UriComponentsBuilder.fromPath("/pages/exhibit.html")
                        .queryParam("id", exhibitId)
                        .build()
                        .toUri()
                : HOME;
        return ResponseEntity.status(HttpStatus.FOUND).location(location).build();
    }
}
