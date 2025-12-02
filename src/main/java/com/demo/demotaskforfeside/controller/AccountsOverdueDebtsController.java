package com.demo.demotaskforfeside.controller;

import com.demo.demotaskforfeside.service.ExcelToHtmlService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.InputStream;
import java.util.Map;

import static java.util.Map.entry;

@Slf4j
@Controller
public class AccountsOverdueDebtsController {
    private final ExcelToHtmlService excelToHtmlService;

    public AccountsOverdueDebtsController(com.demo.demotaskforfeside.service.ExcelToHtmlService excelToHtmlService) {
        this.excelToHtmlService = excelToHtmlService;
    }

    @GetMapping(value = "/overdue-debts", produces = MediaType.APPLICATION_JSON_VALUE)
    public String overdueDebtsPage() {   
        return "pages/overdue-debts/overdue-debts";
    }

    @GetMapping(value = "/overdue-debts/manager", produces = MediaType.APPLICATION_JSON_VALUE)
    public String overdueDebtsManagerPage(Model model) {
        model.addAttribute("mode", "MANAGER");
        model.addAttribute("overallPlan", 150000);
        model.addAttribute("totalExecution", 84250);
        model.addAttribute("percent", 56.3);
        model.addAttribute("remainingAmount", 65750);
        model.addAttribute("overdueDebtAmount", 12000);
        model.addAttribute("overdueDebtPercent", 8.0);
        model.addAttribute("representativeName", "Michael Jackson");
        model.addAttribute("totalWorkDays", 22);
        model.addAttribute("workedDays", 12);
        model.addAttribute("remainingWorkDays", 10);
        model.addAttribute("workedRatio", 0.545);
        model.addAttribute("workedPercent", 54.5);

        return "pages/overdue-debts-manager/overdue-debts-manager";
        // return "pages/overdue-debts-manager/plan-manager";
    }

    @GetMapping(value = "/overdue-debts/data", produces = "text/html; charset=UTF-8")
    public String getOverdueDebtsFragment(Model model,
                                          @RequestParam(value = "contractor", required = false) String contractor) throws Exception {

        ClassPathResource excelResource = new ClassPathResource("Test.xlsx");
        byte[] excelData;
        try (InputStream inputStream = excelResource.getInputStream()) {
            excelData = inputStream.readAllBytes();
        }

        model.addAttribute("tableRows", excelToHtmlService.convertExcelToTableData(excelData));

        return "fragments/excel-table/excel-table :: table";
    }
}
