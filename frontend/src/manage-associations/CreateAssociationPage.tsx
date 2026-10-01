function CreateAssociationPage() {

  return (
    <div>
      <h1>Create New Association</h1>
      <div>
        <label>Association Name</label>
        <input type="text" maxLength={200} className="bg-white border border-black"/>
      </div>
      <div>
        <label>Contact</label>
        <input type="text" className="bg-white border border-black"/>
      </div>
      <button className="border border-black" maxLength={200} onClick={() => console.log("endpoint doesn't exist yet")}>Create</button>
    </div>
  )
}

export default CreateAssociationPage;
