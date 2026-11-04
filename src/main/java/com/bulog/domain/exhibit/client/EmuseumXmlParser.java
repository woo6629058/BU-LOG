package com.bulog.domain.exhibit.client;

import com.bulog.domain.exhibit.exception.ExhibitException;
import com.bulog.domain.exhibit.exception.code.ExhibitErrorCode;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.xml.parsers.DocumentBuilderFactory;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

@Component
public class EmuseumXmlParser {

    private static final String SUCCESS_CODE = "0000";

    public EmuseumPage parseList(String xml) {
        try {
            Document document = parse(xml);
            validateResult(document);

            int pageNumber = parseInt(text(document, "pageNo"));
            int pageSize = parseInt(text(document, "numOfRows"));
            long totalCount = Long.parseLong(text(document, "totalCount"));
            List<EmuseumExhibitSummary> exhibits = new ArrayList<>();

            NodeList dataNodes = document.getElementsByTagName("data");
            for (int index = 0; index < dataNodes.getLength(); index++) {
                Map<String, String> values = itemValues((Element) dataNodes.item(index));
                String id = normalize(values.get("id"));
                String name = firstText(values.get("nameKr"), values.get("name"));
                if (id == null || name == null) {
                    continue;
                }
                exhibits.add(new EmuseumExhibitSummary(
                        id,
                        name,
                        firstText(values.get("museumName2"), "부천시립박물관"),
                        normalize(values.get("imgUri"))
                ));
            }

            return new EmuseumPage(pageNumber, pageSize, totalCount, List.copyOf(exhibits));
        } catch (ExhibitException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ExhibitException(ExhibitErrorCode.EMUSEUM_UNAVAILABLE);
        }
    }

    private Document parse(String xml) throws Exception {
        if (xml == null || xml.isBlank()) {
            throw new ExhibitException(ExhibitErrorCode.EMUSEUM_UNAVAILABLE);
        }
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
        factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
        factory.setXIncludeAware(false);
        factory.setExpandEntityReferences(false);
        return factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));
    }

    private void validateResult(Document document) {
        String resultCode = text(document, "resultCode");
        if (!SUCCESS_CODE.equals(resultCode)) {
            throw new ExhibitException(
                    ExhibitErrorCode.EMUSEUM_UNAVAILABLE,
                    Map.of("externalCode", resultCode == null ? "UNKNOWN" : resultCode)
            );
        }
    }

    private Map<String, String> itemValues(Element dataElement) {
        Map<String, String> values = new LinkedHashMap<>();
        NodeList children = dataElement.getChildNodes();
        for (int index = 0; index < children.getLength(); index++) {
            Node child = children.item(index);
            if (!(child instanceof Element item) || !"item".equals(item.getTagName())) {
                continue;
            }
            values.put(item.getAttribute("key"), item.getAttribute("value"));
        }
        return values;
    }

    private String text(Document document, String tagName) {
        NodeList nodes = document.getElementsByTagName(tagName);
        return nodes.getLength() == 0 ? null : normalize(nodes.item(0).getTextContent());
    }

    private int parseInt(String value) {
        return Integer.parseInt(value);
    }

    private String firstText(String... values) {
        for (String value : values) {
            String normalized = normalize(value);
            if (normalized != null) {
                return normalized;
            }
        }
        return null;
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
