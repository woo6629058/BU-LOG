package com.bulog.domain.exhibit.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bulog.domain.exhibit.exception.ExhibitException;
import org.junit.jupiter.api.Test;

class EmuseumXmlParserTest {

    private final EmuseumXmlParser parser = new EmuseumXmlParser();

    @Test
    void 목록_응답을_소장품_페이지로_변환한다() {
        String xml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <result>
                  <numOfRows>1000</numOfRows>
                  <pageNo>1</pageNo>
                  <totalCount>3687</totalCount>
                  <resultCode>0000</resultCode>
                  <resultMsg>정상적으로 처리되었습니다.</resultMsg>
                  <list>
                    <data>
                      <item key="id" value="PS0100346400100000100000"/>
                      <item key="nameKr" value="지세약해"/>
                      <item key="museumName2" value="부천시립박물관"/>
                      <item key="imgUri" value="http://example.com/img?serviceKey=hidden&amp;imageId=abc%2Bdef%3D"/>
                    </data>
                  </list>
                </result>
                """;

        EmuseumPage page = parser.parseList(xml);

        assertThat(page.pageNumber()).isEqualTo(1);
        assertThat(page.pageSize()).isEqualTo(1000);
        assertThat(page.totalCount()).isEqualTo(3687);
        assertThat(page.exhibits()).containsExactly(new EmuseumExhibitSummary(
                "PS0100346400100000100000",
                "지세약해",
                "부천시립박물관",
                "http://example.com/img?serviceKey=hidden&imageId=abc%2Bdef%3D"
        ));
    }

    @Test
    void 실패_응답이면_외부서비스_예외가_발생한다() {
        String xml = """
                <result>
                  <resultCode>0300</resultCode>
                  <resultMsg>인증키 오류</resultMsg>
                </result>
                """;

        assertThatThrownBy(() -> parser.parseList(xml))
                .isInstanceOf(ExhibitException.class)
                .hasMessage("e뮤지엄 서비스를 일시적으로 이용할 수 없습니다.");
    }
}
