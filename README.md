# When the Creek Rose

A history of the floods of Weeping Water Creek, Cass County, Nebraska, told through clippings from the *Weeping Water Republican* and the *Plattsmouth Journal*, 1883 to today.

Live site: https://denisfitz57.github.io/weeping-water-floods/

This is a static site with no build step: `index.html`, `css/`, `js/`, `data/` and `clips/`. Reader memories are sent to a Google Form owned by the site owner and appear on the page only after they're approved in the form's Google Sheet. Readers need no account. The settings are in `js/config.js`.

### Turning on reader memories (one time, about 15 minutes)

1. **Form:** at forms.google.com create a form with four questions in this order: `Chapter` (short answer, required), `Memory` (paragraph, required), `Name` (short answer), `Email` (short answer). In Settings → Responses choose "Do not collect" email addresses, and leave "Limit to 1 response" off.
2. **Question numbers:** ⋮ → *Get pre-filled link*, fill every box, *Get link*. The `entry.NNN` numbers are Chapter, Memory, Name and Email, in order.
3. **Sheet:** Responses tab → *Link to Sheets* → new spreadsheet. Optionally turn on email notifications from the ⋮ menu.
4. **Approval column:** on the "Form Responses 1" tab, type `Approved` in cell F1.
5. **Public tab:** add a tab named `Published` with this formula in A1, which leaves out emails and unapproved rows:
   `=QUERY('Form Responses 1'!A:F, "select A, B, C, D where F = 'yes'", 1)`
6. **Publish:** File → Share → *Publish to web* → the **Published** tab only → CSV → Publish, then copy the link.
7. **Configure:** in `js/config.js`, set `formAction` to the form's address with `viewform` changed to `formResponse`, set the four `entry.` numbers, and set `publishedCsv` to the CSV link. Commit and push.

**To approve a memory,** type `yes` in its Approved cell. It shows up on the site within about five minutes.

Newspaper scans come from the [Digital Archives of the Weeping Water Public Library](https://weepingwaterne.advantage-preservation.com/). Flow data comes from USGS station 06806500.
