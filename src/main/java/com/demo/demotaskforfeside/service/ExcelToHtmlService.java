package com.demo.demotaskforfeside.service;

import org.apache.poi.hssf.usermodel.HSSFPalette;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.hssf.util.HSSFColor;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Service
public class ExcelToHtmlService {

    public List<List<TableCell>> convertExcelToTableData(byte[] excelFileData) throws IOException {
        try (InputStream in = new ByteArrayInputStream(excelFileData);
             Workbook workbook = WorkbookFactory.create(in)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null || sheet.getLastRowNum() < 0) {
                throw new RuntimeException("Wrong excel file content");
            }

            DataFormatter formatter = new DataFormatter();
            FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();

            Map<CellCoordinate, MergeInfo> mergeMap = collectMergeInfo(sheet);
            Set<CellCoordinate> mergedCells = collectCoveredCells(sheet);

            int maxColumns = detectMaxColumns(sheet, mergeMap);
            int firstRow = Math.max(sheet.getFirstRowNum(), 0);
            int lastRow = sheet.getLastRowNum();

            List<List<TableCell>> tableRows = new ArrayList<>();

            for (int r = firstRow; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                List<TableCell> rowCells = new ArrayList<>();
                for (int c = 0; c < maxColumns; c++) {
                    CellCoordinate coordinate = new CellCoordinate(r, c);
                    if (mergedCells.contains(coordinate) && !mergeMap.containsKey(coordinate)) {
                        continue;
                    }

                    Cell cell = row != null ? row.getCell(c, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK) : null;
                    String text = cell != null ? formatter.formatCellValue(cell, evaluator) : "";
                    String style = buildCellStyle(cell, workbook);
                    MergeInfo mergeInfo = mergeMap.getOrDefault(coordinate, MergeInfo.single());
                    rowCells.add(new TableCell(text, style, mergeInfo.colspan(), mergeInfo.rowspan()));
                }
                tableRows.add(rowCells);
            }

            return tableRows;
        }
    }

    public List<List<TableCell>> buildFallbackTable() {
        List<TableCell> header = List.of(new TableCell("Помилка", defaultCellStyle(), 1, 1));
        List<TableCell> body = List.of(new TableCell("Сесія відсутня", defaultCellStyle(), 1, 1));

        return List.of(header, body);
    }

    private Map<CellCoordinate, MergeInfo> collectMergeInfo(Sheet sheet) {
        Map<CellCoordinate, MergeInfo> mergeInfo = new HashMap<>();
        for (var region : sheet.getMergedRegions()) {
            MergeInfo info = new MergeInfo(region.getLastColumn() - region.getFirstColumn() + 1,
                    region.getLastRow() - region.getFirstRow() + 1);
            mergeInfo.put(new CellCoordinate(region.getFirstRow(), region.getFirstColumn()), info);
        }
        return mergeInfo;
    }

    private Set<CellCoordinate> collectCoveredCells(Sheet sheet) {
        Set<CellCoordinate> covered = new HashSet<>();
        for (var region : sheet.getMergedRegions()) {
            for (int r = region.getFirstRow(); r <= region.getLastRow(); r++) {
                for (int c = region.getFirstColumn(); c <= region.getLastColumn(); c++) {
                    if (r == region.getFirstRow() && c == region.getFirstColumn()) {
                        continue;
                    }
                    covered.add(new CellCoordinate(r, c));
                }
            }
        }
        return covered;
    }

    private int detectMaxColumns(Sheet sheet, Map<CellCoordinate, MergeInfo> mergeMap) {
        int max = 0;
        for (Row row : sheet) {
            if (row != null) {
                max = Math.max(max, row.getLastCellNum());
            }
        }
        for (var entry : mergeMap.entrySet()) {
            CellCoordinate key = entry.getKey();
            MergeInfo info = entry.getValue();
            max = Math.max(max, key.column() + info.colspan());
        }
        return Math.max(max, 0);
    }

    private String buildCellStyle(Cell cell, Workbook workbook) {
        StringBuilder style = new StringBuilder(defaultCellStyle());

        if (cell == null) {
            return style.toString();
        }

        CellStyle cellStyle = cell.getCellStyle();
        if (cellStyle != null) {
            style.append("text-align:").append(toHorizontalAlign(cellStyle.getAlignment())).append(';');
            style.append("vertical-align:").append(toVerticalAlign(cellStyle.getVerticalAlignment())).append(';');

            if (cellStyle.getWrapText()) {
                style.append("white-space:normal;");
            }

            String fillColor = resolveFillColor(cellStyle, workbook);
            if (fillColor != null) {
                style.append("background-color:").append(fillColor).append(';');
            }

            Font font = workbook.getFontAt(cellStyle.getFontIndex());
            if (font != null) {
                if (font.getBold()) {
                    style.append("font-weight:600;");
                }
                if (font.getItalic()) {
                    style.append("font-style:italic;");
                }
                style.append("font-size:").append(font.getFontHeightInPoints()).append("pt;");

                String fontColor = resolveFontColor(font, workbook);
                if (fontColor != null) {
                    style.append("color:").append(fontColor).append(';');
                }
            }
        }

        return style.toString();
    }

    private String defaultCellStyle() {
        return "border:1px solid #d0d7de;padding:8px 12px;font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;"
                + "font-size:13px;line-height:1.35;color:#111827;background-color:#ffffff;text-align:left;vertical-align:middle;"
                + "white-space:pre-wrap;";
    }

    private String toHorizontalAlign(HorizontalAlignment alignment) {
        return switch (alignment) {
            case CENTER, CENTER_SELECTION, FILL, JUSTIFY -> "center";
            case RIGHT -> "right";
            case GENERAL -> "left";
            case LEFT, DISTRIBUTED -> "left";
        };
    }

    private String toVerticalAlign(VerticalAlignment alignment) {
        return switch (alignment) {
            case TOP -> "top";
            case CENTER, DISTRIBUTED, JUSTIFY -> "middle";
            case BOTTOM -> "bottom";
        };
    }

    private String resolveFillColor(CellStyle style, Workbook workbook) {
        if (style.getFillPattern() == FillPatternType.NO_FILL) {
            return null;
        }
        Color color = style.getFillForegroundColorColor();
        if (color == null && workbook instanceof HSSFWorkbook hssfWorkbook) {
            HSSFPalette palette = hssfWorkbook.getCustomPalette();
            HSSFColor hssfColor = palette.getColor(style.getFillForegroundColor());
            return toHexColor(hssfColor);
        }
        return toHexColor(color);
    }

    private String resolveFontColor(Font font, Workbook workbook) {
        if (font instanceof org.apache.poi.xssf.usermodel.XSSFFont xssfFont) {
            return toHexColor(xssfFont.getXSSFColor());
        }
        if (workbook instanceof HSSFWorkbook hssfWorkbook) {
            HSSFPalette palette = hssfWorkbook.getCustomPalette();
            HSSFColor color = palette.getColor(font.getColor());
            return toHexColor(color);
        }
        return null;
    }

    private String toHexColor(Color color) {
        if (color == null) {
            return null;
        }
        if (color instanceof org.apache.poi.xssf.usermodel.XSSFColor xssfColor) {
            byte[] rgb = xssfColor.getRGB();
            if (rgb != null && rgb.length >= 3) {
                return String.format("#%02X%02X%02X", rgb[0] & 0xFF, rgb[1] & 0xFF, rgb[2] & 0xFF);
            }
            byte[] argb = xssfColor.getARGB();
            if (argb != null && argb.length == 4) {
                return String.format("#%02X%02X%02X", argb[1] & 0xFF, argb[2] & 0xFF, argb[3] & 0xFF);
            }
        }
        if (color instanceof HSSFColor hssfColor) {
            short[] triplet = hssfColor.getTriplet();
            if (triplet != null && triplet.length == 3) {
                return String.format("#%02X%02X%02X", triplet[0], triplet[1], triplet[2]);
            }
        }
        return null;
    }

    private record CellCoordinate(int row, int column) {
    }

    private record MergeInfo(int colspan, int rowspan) {
        static MergeInfo single() {
            return new MergeInfo(1, 1);
        }
    }

    public record TableCell(String text, String style, int colspan, int rowspan) {
    }
}
